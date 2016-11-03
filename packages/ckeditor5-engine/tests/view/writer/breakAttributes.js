/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* bender-tags: view, browser-only */

import { breakAttributes } from 'ckeditor5/engine/view/writer.js';
import { stringify, parse } from 'ckeditor5/engine/dev-utils/view.js';
import ContainerElement from 'ckeditor5/engine/view/containerelement.js';
import AttributeElement from 'ckeditor5/engine/view/attributeelement.js';
import Range from 'ckeditor5/engine/view/range.js';
import CKEditorError from 'ckeditor5/utils/ckeditorerror.js';

describe( 'writer', () => {
	describe( 'breakAttributes', () => {
		describe( 'break position', () => {
			/**
			 * Executes test using `parse` and `stringify` utils functions. Uses range delimiters `[]{}` to create and
			 * test break position.
			 *
			 * @param {String} input
			 * @param {String} expected
			 */
			function test( input, expected ) {
				let { view, selection } = parse( input );

				const newPosition = breakAttributes( selection.getFirstPosition() );
				expect( stringify( view.root, newPosition, {
					showType: true,
					showPriority: true
				} ) ).to.equal( expected );
			}

			it( 'should not break text nodes if they are not in attribute elements - middle', () => {
				test(
					'<container:p>foo{}bar</container:p>',
					'<container:p>foo{}bar</container:p>'
				);
			} );

			it( 'should not break text nodes if they are not in attribute elements - beginning', () => {
				test(
					'<container:p>{}foobar</container:p>',
					'<container:p>{}foobar</container:p>'
				);
			} );

			it( 'should not break text nodes if they are not in attribute elements #2 - end', () => {
				test(
					'<container:p>foobar{}</container:p>',
					'<container:p>foobar{}</container:p>'
				);
			} );

			it( 'should split attribute element', () => {
				test(
					'<container:p><attribute:b view-priority="1">foo{}bar</attribute:b></container:p>',
					'<container:p>' +
					'<attribute:b view-priority="1">foo</attribute:b>[]<attribute:b view-priority="1">bar</attribute:b>' +
					'</container:p>'
				);
			} );

			it( 'should move from beginning of the nested text node to the container', () => {
				test(
					'<container:p>' +
					'<attribute:b view-priority="1"><attribute:u view-priority="1">{}foobar</attribute:u></attribute:b>' +
					'</container:p>',
					'<container:p>' +
					'[]<attribute:b view-priority="1"><attribute:u view-priority="1">foobar</attribute:u></attribute:b>' +
					'</container:p>'
				);
			} );

			it( 'should stick selection in text node if it is in container', () => {
				test(
					'<container:p>foo{}<attribute:b view-priority="1">bar</attribute:b></container:p>',
					'<container:p>foo{}<attribute:b view-priority="1">bar</attribute:b></container:p>'
				);
			} );

			it( 'should split nested attributes', () => {
				test(
					'<container:p>' +
					'<attribute:b view-priority="1"><attribute:u view-priority="1">foo{}bar</attribute:u></attribute:b>' +
					'</container:p>',
					'<container:p>' +
					'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">' +
					'foo' +
					'</attribute:u>' +
					'</attribute:b>' +
					'[]' +
					'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">' +
					'bar' +
					'</attribute:u>' +
					'</attribute:b>' +
					'</container:p>'
				);
			} );

			it( 'should move from end of the nested text node to the container', () => {
				test(
					'<container:p>' +
					'<attribute:b view-priority="1"><attribute:u view-priority="1">foobar{}</attribute:u></attribute:b>' +
					'</container:p>',
					'<container:p>' +
					'<attribute:b view-priority="1"><attribute:u view-priority="1">foobar</attribute:u></attribute:b>[]' +
					'</container:p>'
				);
			} );

			it( 'should split attribute element directly in document fragment', () => {
				test(
					'<attribute:b view-priority="1">foo{}bar</attribute:b>',
					'<attribute:b view-priority="1">foo</attribute:b>[]<attribute:b view-priority="1">bar</attribute:b>'
				);
			} );

			it( 'should not split text directly in document fragment', () => {
				test(
					'foo{}bar',
					'foo{}bar'
				);
			} );
		} );

		describe( 'break range', () => {
			/**
			 * Executes test using `parse` and `stringify` utils functions.
			 *
			 * @param {String} input
			 * @param {String} expected
			 */
			function test( input, expected ) {
				let { view, selection } = parse( input );

				const newRange = breakAttributes( selection.getFirstRange() );
				expect( stringify( view.root, newRange, { showType: true } ) ).to.equal( expected );
			}

			it( 'should throw when range placed in two containers', () => {
				const p1 = new ContainerElement( 'p' );
				const p2 = new ContainerElement( 'p' );

				expect( () => {
					breakAttributes( Range.createFromParentsAndOffsets( p1, 0, p2, 0 ) );
				} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
			} );

			it( 'should throw when range has no parent container', () => {
				const el = new AttributeElement( 'b' );

				expect( () => {
					breakAttributes( Range.createFromParentsAndOffsets( el, 0, el, 0 ) );
				} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
			} );

			it( 'should not break text nodes if they are not in attribute elements', () => {
				test(
					'<container:p>foo{}bar</container:p>',
					'<container:p>foo{}bar</container:p>'
				);
			} );

			it( 'should break at collapsed range and return collapsed one', () => {
				test(
					'<container:p><attribute:b>foo{}bar</attribute:b></container:p>',
					'<container:p><attribute:b>foo</attribute:b>[]<attribute:b>bar</attribute:b></container:p>'
				);
			} );

			it( 'should break inside text node #1', () => {
				test(
					'<container:p><attribute:b>foo{bar}baz</attribute:b></container:p>',
					'<container:p><attribute:b>foo</attribute:b>[<attribute:b>bar</attribute:b>]<attribute:b>baz</attribute:b></container:p>'
				);
			} );

			it( 'should break inside text node #2', () => {
				test(
					'<container:p><attribute:b>foo{barbaz}</attribute:b></container:p>',
					'<container:p><attribute:b>foo</attribute:b>[<attribute:b>barbaz</attribute:b>]</container:p>'
				);
			} );

			it( 'should break inside text node #3', () => {
				test(
					'<container:p><attribute:b>foo{barbaz]</attribute:b></container:p>',
					'<container:p><attribute:b>foo</attribute:b>[<attribute:b>barbaz</attribute:b>]</container:p>'
				);
			} );

			it( 'should break inside text node #4', () => {
				test(
					'<container:p><attribute:b>{foo}barbaz</attribute:b></container:p>',
					'<container:p>[<attribute:b>foo</attribute:b>]<attribute:b>barbaz</attribute:b></container:p>'
				);
			} );

			it( 'should break inside text node #5', () => {
				test(
					'<container:p><attribute:b>[foo}barbaz</attribute:b></container:p>',
					'<container:p>[<attribute:b>foo</attribute:b>]<attribute:b>barbaz</attribute:b></container:p>'
				);
			} );

			it( 'should break placed inside different nodes', () => {
				test(
					'<container:p>foo{bar<attribute:b>baz}qux</attribute:b></container:p>',
					'<container:p>foo{bar<attribute:b>baz</attribute:b>]<attribute:b>qux</attribute:b></container:p>'
				);
			} );

			it( 'should split attribute element directly in document fragment', () => {
				test(
					'<attribute:b>fo{ob}ar</attribute:b>',
					'<attribute:b>fo</attribute:b>[<attribute:b>ob</attribute:b>]<attribute:b>ar</attribute:b>'
				);
			} );

			it( 'should not split text directly in document fragment', () => {
				test(
					'foo{}bar',
					'foo{}bar'
				);
			} );
		} );
	} );
} );
